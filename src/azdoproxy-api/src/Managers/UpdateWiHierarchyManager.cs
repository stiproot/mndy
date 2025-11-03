
namespace azdoproxy_api.Managers;

internal class UpdateWiHierarchyManager
    : BaseManager<UpdateWiHierarchyCmd, UpdateWiHierarchyRes>, IManager<UpdateWiHierarchyReq, UpdateWiHierarchyResp>
{
    public UpdateWiHierarchyManager(IProcessor<UpdateWiHierarchyCmd, UpdateWiHierarchyRes> processor)
        : base(processor)
    {
    }

    public async Task<UpdateWiHierarchyResp> ManageAsync(UpdateWiHierarchyReq req)
    {
        await this._Processor.ProcessAsync(req.Cmd);
        return new UpdateWiHierarchyResp();
    }
}
