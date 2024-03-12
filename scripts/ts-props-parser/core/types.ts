export interface IPropItem {
  name?: string;
  title: { label: string; tip?: string };
  setter: {
    componentName: string;
    isRequired?: boolean;
    initialValue?: any;
    props?: any;
    // options?: { label: string; value: string }[];
  };
}
