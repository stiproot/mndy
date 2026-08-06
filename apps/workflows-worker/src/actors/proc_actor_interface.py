from abc import abstractmethod
from dapr.actor import ActorInterface, actormethod
from typing import Awaitable, T


class MndyActorInterface(ActorInterface):

    @abstractmethod
    @actormethod(name="set_state")
    async def set_state(self, data: T) -> Awaitable: ...

    @abstractmethod
    @actormethod(name="get_state")
    async def get_state(self) -> Awaitable[T]: ...

    @abstractmethod
    @actormethod(name="clear_state")
    async def clear_state(self) -> Awaitable: ...
