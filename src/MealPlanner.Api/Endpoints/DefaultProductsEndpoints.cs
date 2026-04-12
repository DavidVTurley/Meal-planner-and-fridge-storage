using MealPlanner.Api.Infrastructure;
using MealPlanner.Application.Inventory;

namespace MealPlanner.Api.Endpoints;

internal static class DefaultProductsEndpoints
{
    public static IEndpointRouteBuilder MapDefaultProductsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/default-products", async (
            HttpContext httpContext,
            CreateDefaultProductRequest request,
            DefaultProductService service,
            CancellationToken cancellationToken) =>
        {
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
            var items = await service.ListCurrentAsync(userId, cancellationToken);
            return Results.Ok(items);
        })
            .WithSummary("List default products")
            .WithDescription("Returns the current active default product templates for the user.")
            .RequireUserIdHeader();

        return app;
    }
}
