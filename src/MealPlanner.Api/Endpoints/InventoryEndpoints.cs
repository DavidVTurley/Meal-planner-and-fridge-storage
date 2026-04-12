using MealPlanner.Api.Infrastructure;
using MealPlanner.Application.Inventory;

namespace MealPlanner.Api.Endpoints;

internal static class InventoryEndpoints
{
    public static IEndpointRouteBuilder MapInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/inventory-items", async (
            HttpContext httpContext,
            CreateInventoryItemRequest request,
            InventoryService service,
            CancellationToken cancellationToken) =>
        {
            var userId = ApiRequestContext.RequireUserId(httpContext);
            var item = await service.CreateAsync(userId, request, cancellationToken);
            httpContext.Response.Headers.ETag = ETagHelper.Quote(item.ETag);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
            var ifMatch = httpContext.Request.Headers.IfMatch.ToString();
            var updated = await service.ManualDecrementAsync(userId, id, ifMatch, request, cancellationToken);
            httpContext.Response.Headers.ETag = ETagHelper.Quote(updated.ETag);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
            var item = await service.GetByIdAsync(userId, id, cancellationToken);
            httpContext.Response.Headers.ETag = ETagHelper.Quote(item.ETag);
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

        return app;
    }
}
