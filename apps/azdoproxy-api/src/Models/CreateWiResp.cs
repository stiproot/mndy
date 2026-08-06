
namespace azdoproxy_api.Models;

internal record CreateWiResp : Resp
{
    public WiRes Res { get; init; } = new();
}