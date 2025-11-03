
namespace azdoproxy_api.Managers;

internal class BulkCreateWiManager : BaseManager<CreateWiCmd, WiRes>, IManager<BulkCreateWiReq, BulkCreateWiResp>
{
    public BulkCreateWiManager(IProcessor<CreateWiCmd, WiRes> processor)
        : base(processor)
    {
    }

    public async Task<BulkCreateWiResp> ManageAsync(BulkCreateWiReq req)
    {
        try
        {
            await Task.WhenAll(req.Cmds.Select(this._Processor.ProcessAsync));
            return new BulkCreateWiResp();
        }
        catch (Exception ex)
        {
            System.Console.WriteLine(ex.StackTrace);
            System.Console.WriteLine(ex.InnerException?.StackTrace);
            throw;
        }
    }
}
