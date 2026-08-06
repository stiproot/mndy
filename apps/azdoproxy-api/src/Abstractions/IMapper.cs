
namespace azdoproxy_api.Abstractions;

internal interface IMapper<in TSrc, out TTrgt>
    where TTrgt : new()
{
    TTrgt Map(TSrc source);
}
