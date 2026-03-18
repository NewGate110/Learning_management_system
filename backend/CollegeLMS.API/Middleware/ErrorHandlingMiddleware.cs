namespace CollegeLMS.API.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    // TODO (Person 3): Implement global error handling
    // - Catch unhandled exceptions from the pipeline
    // - Log the error with logger
    // - Return a standardised JSON error response (status 500)
    // - Handle 401/403 cases with appropriate messages

    public async Task InvokeAsync(HttpContext context)
    {
        // TODO (Person 3): Wrap in try/catch and handle exceptions here
        await next(context);
    }
}
