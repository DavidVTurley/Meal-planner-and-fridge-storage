using MealPlanner.Api.Infrastructure;
using MealPlanner.Application.Meals;

namespace MealPlanner.Api.Endpoints;

internal static class UnknownIngredientsEndpoints
{
    public static IEndpointRouteBuilder MapUnknownIngredientsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/unknown-ingredients", async (
            HttpContext httpContext,
            MealService service,
            CancellationToken cancellationToken) =>
        {
            var userId = ApiRequestContext.RequireUserId(httpContext);
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
            var userId = ApiRequestContext.RequireUserId(httpContext);
            await service.ConvertUnknownIngredientAsync(userId, request, cancellationToken);
            return Results.NoContent();
        })
            .WithSummary("Convert unknown ingredient")
            .WithDescription("Converts an unknown ingredient to a known default product and relinks meal lines.")
            .RequireUserIdHeader();

        return app;
    }
}
