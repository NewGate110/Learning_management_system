namespace CollegeLMS.API.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);

            if (context.Response.HasStarted)
            {
                return;
            }

            if (context.Response.StatusCode is StatusCodes.Status401Unauthorized or StatusCodes.Status403Forbidden &&
                string.IsNullOrEmpty(context.Response.ContentType))
            {
                await WriteStatusResponseAsync(context);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Unhandled exception while processing {Method} {Path}.",
                context.Request.Method,
                context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                status = StatusCodes.Status500InternalServerError,
                title = "Internal Server Error",
                detail = "An unexpected error occurred while processing the request."
            });
        }
    }

    private static Task WriteStatusResponseAsync(HttpContext context)
    {
        var detail = context.Response.StatusCode == StatusCodes.Status401Unauthorized
            ? "A valid bearer token is required to access this endpoint."
            : "You do not have permission to access this endpoint.";

        var title = context.Response.StatusCode == StatusCodes.Status401Unauthorized
            ? "Unauthorized"
            : "Forbidden";

        context.Response.ContentType = "application/json";

        return context.Response.WriteAsJsonAsync(new
        {
            status = context.Response.StatusCode,
            title,
            detail
        });
    }
}
