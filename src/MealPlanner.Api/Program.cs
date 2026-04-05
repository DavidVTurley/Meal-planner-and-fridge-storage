using System.Net;
using MealPlanner.Application.Inventory;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddOpenApi("v1", options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = "MealPlanner API",
            Version = "v1",
            Description = "Interactive API docs for testing meal planner backend flows.",
        };

        return Task.CompletedTask;
    });
});
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.UseSwaggerUI(options =>
    {
        options.RoutePrefix = "openapi";
        options.SwaggerEndpoint("/openapi/v1.json", "MealPlanner API v1");
        options.DocumentTitle = "MealPlanner API Docs";
    });
}

app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;

        var (status, title) = exception switch
        {
            DomainValidationException => (HttpStatusCode.BadRequest, "Validation error"),
            NotFoundException => (HttpStatusCode.NotFound, "Not found"),
            ConcurrencyConflictException => (HttpStatusCode.Conflict, "Concurrency conflict"),
            _ => (HttpStatusCode.InternalServerError, "Unhandled error"),
        };

        context.Response.StatusCode = (int)status;
        await Results.Problem(
                title: title,
                detail: exception?.Message,
                statusCode: (int)status)
            .ExecuteAsync(context);
    });
});

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithSummary("Health check")
    .WithDescription("Returns service availability status.");

app.MapPost("/api/default-products", async (
    HttpContext httpContext,
    CreateDefaultProductRequest request,
    DefaultProductService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var created = await service.CreateAsync(userId, request, cancellationToken);
    return Results.Created($"/api/default-products/{created.Id}", created);
})
    .WithSummary("Create default product")
    .WithDescription("Creates a default product template for the current user.")
    .RequireUserIdHeader();

app.MapPatch("/api/default-products/{id:guid}", async (
    HttpContext httpContext,
    Guid id,
    UpdateDefaultProductRequest request,
    DefaultProductService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var created = await service.CreateNextVersionAsync(userId, id, request, cancellationToken);
    return Results.Ok(created);
})
    .WithSummary("Update default product")
    .WithDescription("Creates the next version of an existing default product template.")
    .RequireUserIdHeader();

app.MapGet("/api/default-products", async (
    HttpContext httpContext,
    DefaultProductService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var items = await service.ListCurrentAsync(userId, cancellationToken);
    return Results.Ok(items);
})
    .WithSummary("List default products")
    .WithDescription("Returns the current active default product templates for the user.")
    .RequireUserIdHeader();

app.MapPost("/api/inventory-items", async (
    HttpContext httpContext,
    CreateInventoryItemRequest request,
    InventoryService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var item = await service.CreateAsync(userId, request, cancellationToken);
    httpContext.Response.Headers.ETag = QuoteTag(item.ETag);
    return Results.Created($"/api/inventory-items/{item.Id}", item);
})
    .WithSummary("Create inventory item")
    .WithDescription("Creates an inventory package and returns its ETag in the response headers.")
    .RequireUserIdHeader();

app.MapPatch("/api/inventory-items/{id:guid}/manual-decrement", async (
    HttpContext httpContext,
    Guid id,
    ManualDecrementRequest request,
    InventoryService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var ifMatch = httpContext.Request.Headers.IfMatch.ToString();
    var updated = await service.ManualDecrementAsync(userId, id, ifMatch, request, cancellationToken);
    httpContext.Response.Headers.ETag = QuoteTag(updated.ETag);
    return Results.Ok(updated);
})
    .WithSummary("Manually decrement inventory item")
    .WithDescription("Decrements remaining amount for an inventory item. Send If-Match with the latest ETag; response returns a fresh ETag.")
    .RequireUserIdHeader()
    .RequireIfMatchHeader("Use the latest quoted ETag value returned by create/get/list inventory operations.");

app.MapGet("/api/inventory-items", async (
    HttpContext httpContext,
    string? location,
    string? search,
    InventoryService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var items = await service.ListAsync(userId, location, search, cancellationToken);
    return Results.Ok(items);
})
    .WithSummary("List inventory items")
    .WithDescription("Returns inventory items for the user, optionally filtered by location or search text.")
    .RequireUserIdHeader();

app.MapGet("/api/inventory-items/{id:guid}", async (
    HttpContext httpContext,
    Guid id,
    InventoryService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var item = await service.GetByIdAsync(userId, id, cancellationToken);
    httpContext.Response.Headers.ETag = QuoteTag(item.ETag);
    return Results.Ok(item);
})
    .WithSummary("Get inventory item")
    .WithDescription("Gets a single inventory item and returns its current ETag in the response headers.")
    .RequireUserIdHeader();

app.MapGet("/api/inventory/default-inference", (string ingredientName, InventoryService service) =>
{
    return Results.Ok(service.GetDefaultInference(ingredientName));
})
    .WithSummary("Get default ingredient inference")
    .WithDescription("Returns inferred unit and amount defaults for a free-text ingredient name.");

app.Run();

static string RequireUserId(HttpContext httpContext)
{
    if (!httpContext.Request.Headers.TryGetValue("X-User-Id", out var userId) || string.IsNullOrWhiteSpace(userId))
    {
        throw new DomainValidationException("X-User-Id header is required.");
    }

    return userId.ToString().Trim();
}

static string QuoteTag(string etag) => $"\"{etag}\"";

internal static class OpenApiEndpointExtensions
{
    public static RouteHandlerBuilder RequireUserIdHeader(this RouteHandlerBuilder builder)
    {
        return builder.WithOpenApi(operation =>
        {
            operation.Parameters ??= [];
            if (operation.Parameters.Any(parameter => parameter.Name == "X-User-Id" && parameter.In == ParameterLocation.Header))
            {
                return operation;
            }

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-User-Id",
                In = ParameterLocation.Header,
                Required = true,
                Description = "Required user identifier used for scoping all /api resources.",
                Schema = new OpenApiSchema { Type = "string" },
            });

            return operation;
        });
    }

    public static RouteHandlerBuilder RequireIfMatchHeader(this RouteHandlerBuilder builder, string description)
    {
        return builder.WithOpenApi(operation =>
        {
            operation.Parameters ??= [];
            if (operation.Parameters.Any(parameter => parameter.Name == "If-Match" && parameter.In == ParameterLocation.Header))
            {
                return operation;
            }

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "If-Match",
                In = ParameterLocation.Header,
                Required = true,
                Description = description,
                Schema = new OpenApiSchema { Type = "string" },
            });

            return operation;
        });
    }
}
