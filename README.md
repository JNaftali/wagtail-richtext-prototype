This project intends to be able to render ContentState json (as produced by the Wagtail cms) with React. It expects rich text data serialized as in the following serializer:

```python
from rest_framework.serializers import BaseSerializer
from wagtail.admin.rich_text.converters.contentstate import ContentstateConverter
from wagtail.embeds.models import Embed
import json

class RichTextFieldSerializer(BaseSerializer):
    def to_representation(self, instance):
        converter = ContentstateConverter(features=features)
        content = json.loads(converter.from_database_format(instance))
        for key in content["entityMap"]:
            entity = content["entityMap"][key]
            if entity["type"] != "EMBED":
                continue

            entity["data"]["html"] = Embed.objects.get(url=entity["data"]["url"]).html
        return content
```
