using Xo.AzDO.Engine.Extensions;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace azdoproxy_api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAzdoProxyApiServices(this IServiceCollection @this)
    {
        @this.AddServices();

        @this.TryAddSingleton<IManager<CloneWiReq, CloneWiResp>, CloneWiManager>();
        @this.TryAddSingleton<IManager<BulkCreateWiReq, BulkCreateWiResp>, BulkCreateWiManager>();
        @this.TryAddSingleton<IManager<CreateDashReq, CreateDashResp>, CreateDashboardManager>();
        @this.TryAddSingleton<IManager<UpdateWiReq, UpdateWiResp>, UpdateWiManager>();
        @this.TryAddSingleton<IManager<UpdateWiHierarchyReq, UpdateWiHierarchyResp>, UpdateWiHierarchyManager>();

        return @this;
    }
}
