using Microsoft.OpenApi;

namespace MealPlanner.Api.Infrastructure;

internal static class RouteHandlerBuilderOpenApiExtensions
{
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
