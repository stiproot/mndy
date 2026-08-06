import logging
from mndy_framework import (
    EnvVarProvider,
    RootCmd,
    CmdTypes,
    ProcStatuses,
    AzdoProxyHttpClient,
    DaprConfigs,
    publish_event,
)


env_var_provider = EnvVarProvider()

AZDO_PROXY_BASE_URL = env_var_provider.get_env_var(
    "AZDO_PROXY_BASE_URL", "http://mndy-azdoproxy-api:5000"
)

azdoproxy_client = AzdoProxyHttpClient(base_url=AZDO_PROXY_BASE_URL)

fn_hash = {
    CmdTypes.BULK_CREATE_UNITS_OF_WORK: lambda cmd_data: azdoproxy_client.bulkCreateWi(
        cmd_data
    ),
    CmdTypes.CLONE_UNIT_OF_WORK: lambda cmd_data: azdoproxy_client.cloneWi(cmd_data),
    CmdTypes.CREATE_DASHBOARD: lambda cmd_data: azdoproxy_client.createDashboard(
        cmd_data
    ),
    CmdTypes.UPDATE_UNIT_OF_WORK: lambda cmd_data: azdoproxy_client.updateWi(cmd_data),
    CmdTypes.UPDATE_UNIT_OF_WORK_HIERARCHY: lambda cmd_data: azdoproxy_client.updateWiHierarchy(
        cmd_data
    ),
}


async def process_azdoproxy_cmd_workflow(cmd: RootCmd) -> int:
    # await update_proc_status(cmd=cmd, status=ProcStatuses.RUNNING.value)

    try:
        fn_hash[cmd.cmd_type](cmd.cmd_data)
    except Exception as e:
        logging.error(f"Error processing cmd {cmd}: {e}")
        # await update_proc_status(cmd=cmd, status=ProcStatuses.ERROR.value, err=str(e))
        return

    await publish_event(
        pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
        topic_name=DaprConfigs.AZDO_PROXY_RECEIPT_TOPIC.value,
        data=cmd._serialize_(),
    )
