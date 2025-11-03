
namespace azdoproxy_api.Abstractions;

internal interface IManager<in TIn, TOut>
  where TIn : IReq
  where TOut : IResp
{
    Task<TOut> ManageAsync(TIn input);
}