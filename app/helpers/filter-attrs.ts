import Helper from '@ember/component/helper';

export default class FilterAttrs extends Helper  {

  compute([metaAttributes]: [number[]]): number[] {
    if (!metaAttributes.length) {
      return metaAttributes;
    }

    return metaAttributes.filter((attr) => attr > 1);
  }
}