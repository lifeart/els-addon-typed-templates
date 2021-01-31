import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import MetadataVisibility from '../services/metadata-visibility';
import MetaAttribute from 'dreamcatcher-web-app/models/meta-attribute';

export default class extends Helper {
  @service
  metadataVisibility!: MetadataVisibility;

  compute([metaAttributes]: [MetaAttribute[]]): MetaAttribute[] {
    if (!metaAttributes.length) {
      return metaAttributes;
    }

    return metaAttributes.filter((attr) => this.metadataVisibility.isAttributeVisible(attr));
  }
}
