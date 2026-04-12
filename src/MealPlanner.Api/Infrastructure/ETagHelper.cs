namespace MealPlanner.Api.Infrastructure;

internal static class ETagHelper
{
    public static string Quote(string etag) => $"\"{etag}\"";
}
