
namespace azdoproxy_api.Managers;

internal class CreateDashboardManager : BaseManager<CreateDashboardWorkflowCmd, DashboardWorkflowRes>, IManager<CreateDashReq, CreateDashResp>
{
    public CreateDashboardManager(IProcessor<CreateDashboardWorkflowCmd, DashboardWorkflowRes> processor)
        : base(processor)
    {
    }

    public async Task<CreateDashResp> ManageAsync(CreateDashReq req)
    {
        await this._Processor.ProcessAsync(req.Cmd);
        return new CreateDashResp();
    }
}