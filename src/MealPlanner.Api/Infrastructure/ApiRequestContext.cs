using MealPlanner.Domain.Inventory;

namespace MealPlanner.Api.Infrastructure;

internal static class ApiRequestContext
{
    public static string RequireUserId(HttpContext httpContext)
    {
        if (!httpContext.Request.Headers.TryGetValue("X-User-Id", out var userId) || string.IsNullOrWhiteSpace(userId))
        {
            throw new DomainValidationException("X-User-Id header is required.");
        }

        return userId.ToString().Trim();
    }
}
