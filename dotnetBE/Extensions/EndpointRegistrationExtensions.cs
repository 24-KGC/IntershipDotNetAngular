using dotnetBE.Endpoints;

namespace dotnetBE.Extensions;

public static class EndpointRegistrationExtensions
{
    public static WebApplication MapAppEndpoints(this WebApplication app)
    {
        app.MapAuthEndpoints();
        app.MapTaskEndpoints();
        app.MapRecipeEndpoints();

        return app;
    }
}