using MealPlanner.Api.Infrastructure;
using MealPlanner.Application.Meals;

namespace MealPlanner.Api.Endpoints;

internal static class MealsEndpoints
{
    public static IEndpointRouteBuilder MapMealsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/meals", async (
            HttpContext httpContext,
            CreateMealRequest request,
            MealService service,
            CancellationToken cancellationToken) =>
        {
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
            var meal = await service.GetByIdAsync(userId, id, cancellationToken);
            return Results.Ok(meal);
        })
            .WithSummary("Get meal definition")
            .WithDescription("Returns one meal definition including ingredient lines.")
            .RequireUserIdHeader();

        return app;
    }
}
