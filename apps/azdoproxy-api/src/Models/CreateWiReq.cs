
namespace azdoproxy_api.Models;

internal record CreateWiReq : Req
{
    public CreateWiCmd Cmd { get; init; } = new();
}