using System.Net;
using MealPlanner.Application.Inventory;
using MealPlanner.Application.Meals;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure;
using Microsoft.OpenApi;

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapGet("/openapi", () => Results.Content(OpenApiEndpointExtensions.SwaggerUiHtml, "text/html"));
}

app.UseStaticFiles();

app.MapGet("/ui", (IWebHostEnvironment environment) =>
{
    var filePath = Path.Combine(environment.WebRootPath, "ui", "index.html");
    return Results.File(filePath, "text/html");
});

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

app.MapPost("/api/meals", async (
    HttpContext httpContext,
    CreateMealRequest request,
    MealService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var created = await service.CreateAsync(userId, request, cancellationToken);
    return Results.Created($"/api/meals/{created.Id}", created);
})
    .WithSummary("Create meal definition")
    .WithDescription("Creates a meal definition with measurement-based ingredient lines.")
    .RequireUserIdHeader();

app.MapPatch("/api/meals/{id:guid}", async (
    HttpContext httpContext,
    Guid id,
    UpdateMealRequest request,
    MealService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var updated = await service.UpdateAsync(userId, id, request, cancellationToken);
    return Results.Ok(updated);
})
    .WithSummary("Update meal definition")
    .WithDescription("Replaces meal ingredient lines and updates the meal name.")
    .RequireUserIdHeader();

app.MapGet("/api/meals", async (
    HttpContext httpContext,
    MealService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var meals = await service.ListAsync(userId, cancellationToken);
    return Results.Ok(meals);
})
    .WithSummary("List meal definitions")
    .WithDescription("Returns all meal definitions for the current user.")
    .RequireUserIdHeader();

app.MapGet("/api/meals/{id:guid}", async (
    HttpContext httpContext,
    Guid id,
    MealService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var meal = await service.GetByIdAsync(userId, id, cancellationToken);
    return Results.Ok(meal);
})
    .WithSummary("Get meal definition")
    .WithDescription("Returns one meal definition including ingredient lines.")
    .RequireUserIdHeader();

app.MapGet("/api/unknown-ingredients", async (
    HttpContext httpContext,
    MealService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    var unknowns = await service.ListUnknownIngredientsAsync(userId, cancellationToken);
    return Results.Ok(unknowns);
})
    .WithSummary("List unknown ingredients")
    .WithDescription("Lists active unknown ingredients and where they are used in meals.")
    .RequireUserIdHeader();

app.MapPost("/api/unknown-ingredients/convert", async (
    HttpContext httpContext,
    ConvertUnknownIngredientRequest request,
    MealService service,
    CancellationToken cancellationToken) =>
{
    var userId = RequireUserId(httpContext);
    await service.ConvertUnknownIngredientAsync(userId, request, cancellationToken);
    return Results.NoContent();
})
    .WithSummary("Convert unknown ingredient")
    .WithDescription("Converts an unknown ingredient to a known default product and relinks meal lines.")
    .RequireUserIdHeader();

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
    public const string SwaggerUiHtml = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MealPlanner API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #f7f7f7; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/openapi/v1.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true
    });
  </script>
</body>
</html>
""";

    public static RouteHandlerBuilder RequireUserIdHeader(this RouteHandlerBuilder builder)
    {
        return builder.AddOpenApiOperationTransformer((operation, _, _) =>
        {
            operation.Parameters ??= [];
            if (operation.Parameters.Any(parameter => parameter.Name == "X-User-Id" && parameter.In == ParameterLocation.Header))
            {
                return Task.CompletedTask;
            }

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-User-Id",
                In = ParameterLocation.Header,
                Required = true,
                Description = "Required user identifier used for scoping all /api resources.",
                Schema = new OpenApiSchema { Type = JsonSchemaType.String },
            });

            return Task.CompletedTask;
        });
    }

    public static RouteHandlerBuilder RequireIfMatchHeader(this RouteHandlerBuilder builder, string description)
    {
        return builder.AddOpenApiOperationTransformer((operation, _, _) =>
        {
            operation.Parameters ??= [];
            if (operation.Parameters.Any(parameter => parameter.Name == "If-Match" && parameter.In == ParameterLocation.Header))
            {
                return Task.CompletedTask;
            }

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "If-Match",
                In = ParameterLocation.Header,
                Required = true,
                Description = description,
                Schema = new OpenApiSchema { Type = JsonSchemaType.String },
            });

            return Task.CompletedTask;
        });
    }
}
