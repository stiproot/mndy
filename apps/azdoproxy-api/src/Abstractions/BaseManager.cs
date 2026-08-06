
namespace azdoproxy_api.Abstractions;

internal abstract class BaseManager<TProcessorCmd, TProcessorRes>
  where TProcessorCmd : IProcessorCmd
  where TProcessorRes : IProcessorRes
{
    protected readonly IProcessor<TProcessorCmd, TProcessorRes> _Processor;

    protected BaseManager(IProcessor<TProcessorCmd, TProcessorRes> processor)
        => _Processor = processor;
}
