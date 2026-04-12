using System.Net;
using MealPlanner.Api.Endpoints;
using MealPlanner.Api.Infrastructure;
using MealPlanner.Application.Inventory;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapGet("/openapi", () => Results.Content(OpenApiSupport.SwaggerUiHtml, "text/html"));
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

app.MapDefaultProductsEndpoints();
app.MapInventoryEndpoints();
app.MapMealsEndpoints();
app.MapUnknownIngredientsEndpoints();

app.Run();
