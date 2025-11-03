import logging
from typing import Awaitable, T
from json import loads as json_loads
from dapr.actor import Actor
from .proc_actor_interface import MndyActorInterface


class MndyProcActor(Actor, MndyActorInterface):

    _state_key = "procs"
    _actor_id: str

    def __init__(self, ctx, actor_id):
        self._actor_id = actor_id
        super(MndyProcActor, self).__init__(ctx, actor_id)

    async def _on_activate(self) -> None:
        logging.info(f"Activate {self.__class__.__name__} actor!")

    async def _on_deactivate(self) -> None:
        logging.info(f"Deactivate {self.__class__.__name__} actor!")

    async def set_state(self, data: T) -> Awaitable:
        print(f"set_state")
        await self._state_manager.set_state(self._state_key, data)
        await self._state_manager.save_state()

    async def get_state(self) -> Awaitable[T]:
        logging.info(f"get_state")
        has_value, val = await self._state_manager.try_get_state(self._state_key)
        if not has_value:
            return {}
        return val

    async def clear_state(self) -> Awaitable:
        logging.info("clear_state")
        await self._state_manager.remove_state(self._state_key)
        await self._state_manager.save_state()
