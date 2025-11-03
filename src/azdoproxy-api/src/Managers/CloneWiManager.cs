
namespace azdoproxy_api.Managers;

internal class CloneWiManager
    : BaseManager<CloneWiCmd, CloneWiRes>, IManager<CloneWiReq, CloneWiResp>
{
    public CloneWiManager(IProcessor<CloneWiCmd, CloneWiRes> processor)
        : base(processor)
    {
    }

    public async Task<CloneWiResp> ManageAsync(CloneWiReq req)
    {
        await this._Processor.ProcessAsync(req.Cmd);
        return new CloneWiResp();
    }
}