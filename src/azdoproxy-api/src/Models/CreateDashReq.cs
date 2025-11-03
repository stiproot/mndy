
namespace azdoproxy_api.Models;

internal record CreateDashReq : Req
{
    public CreateDashboardWorkflowCmd Cmd { get; init; } = new();
}