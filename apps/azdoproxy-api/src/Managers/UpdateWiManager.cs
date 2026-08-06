
namespace azdoproxy_api.Managers;

internal class UpdateWiManager
    : BaseManager<UpdateWiCmd, UpdateWiRes>, IManager<UpdateWiReq, UpdateWiResp>
{
    public UpdateWiManager(IProcessor<UpdateWiCmd, UpdateWiRes> processor)
        : base(processor)
    {
    }

    public async Task<UpdateWiResp> ManageAsync(UpdateWiReq req)
    {
        await this._Processor.ProcessAsync(req.Cmd);
        return new UpdateWiResp();
    }
}