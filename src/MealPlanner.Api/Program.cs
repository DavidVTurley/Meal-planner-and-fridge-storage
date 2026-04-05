using System.Net;
using MealPlanner.Application.Inventory;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

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

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/default-products", async (
    HttpContext httpContext,
    CreateDefaultProductRequest request,
    DefaultProductService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var created = await service.CreateAsync(userId, request, cancellationToken);
    return Results.Created($"/api/default-products/{created.Id}", created);
});

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
});

app.MapGet("/api/default-products", async (
    HttpContext httpContext,
    DefaultProductService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var items = await service.ListCurrentAsync(userId, cancellationToken);
    return Results.Ok(items);
});

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
});

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
});

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
});

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
});

app.MapGet("/api/inventory/default-inference", (string ingredientName, InventoryService service) =>
{
    return Results.Ok(service.GetDefaultInference(ingredientName));
});

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
