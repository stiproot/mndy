
namespace azdoproxy_api.Models;

internal record CloneWiReq : Req
{
    public CloneWiCmd Cmd { get; init; } = new();
}