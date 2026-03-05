
export interface IItemAction {
  evtId: string;
  tooltip: string | null | undefined;
  btnIcon: string | null | undefined;
  btnText: string | null | undefined;
}

export interface IItemHeaderIcon {
  icon: string;
}

export interface IItem<TData> {
  data: TData;
  title: string;
  description: string | null | undefined;
  color: string;
  actions: IItemAction[] | null | undefined;
  headerIcons: IItemHeaderIcon[] | null | undefined;
}