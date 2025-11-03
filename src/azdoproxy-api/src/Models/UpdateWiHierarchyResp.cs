
namespace azdoproxy_api.Models;

internal record UpdateWiHierarchyResp : Resp
{
    public UpdateWiHierarchyRes Res { get; init; } = new();
}
