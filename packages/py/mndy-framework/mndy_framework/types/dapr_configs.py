from enum import Enum


class DaprConfigs(Enum):
    DAPR_PROJS_STATE_STORE_NAME = "statestore-projs"
    DAPR_PROCS_STATE_STORE_NAME = "statestore-procs"
    DAPR_USRS_STATE_STORE_NAME = "statestore-usrs"
    DAPR_STRUCTS_STATE_STORE_NAME = "statestore-structs"
    DAPR_AZDO_STATE_STORE_NAME = "statestore-azdo"
    DAPR_PUBSUB_NAME = "pubsub"
    DAPR_CMD_EXT_PUBSUB_NAME = "pubsub-cmd-ext"
    DAPR_CMD_GATHER_PUBSUB_NAME = "pubsub-cmd-gather"
    DAPR_CMD_STRUCTURE_PUBSUB_NAME = "pubsub-cmd-structure"
    DAPR_CMD_WORKFLOW_PUBSUB_NAME = "pubsub-cmd-workflow"
    DAPR_CMD_RECEIPT_PUBSUB_NAME = "pubsub-cmd-receipt"
    GATHER_TOPIC = "MNDY_CMD_GATHER"
    STRUCTURE_TOPIC = "MNDY_CMD_STRUCTURE"
    AZDO_PROXY_TOPIC = "MNDY_CMD_AZDO_PROXY"
    WORKFLOW_TOPIC = "MNDY_CMD_WORKFLOW"
    GATHER_RECEIPT_TOPIC = "MNDY_CMD_GATHER_RECEIPT"
    STRUCTURE_RECEIPT_TOPIC = "MNDY_CMD_STRUCTURE_RECEIPT"
    AZDO_PROXY_RECEIPT_TOPIC = "MNDY_CMD_AZDO_PROXY_RECEIPT"


class PartitionKeys(Enum):
    PROCS = "procs"
    PROJS = "projs"
    USRS = "usrs"