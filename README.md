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

In the above code, `features` refers to the list of features that the `RichText` field that you are trying to serialize supports. This project aims to work with all built in wagtail RichText features (h#, bold, italic, ordered/unordered lists, hrs, links, document links, images, embeds, inline code, super/subscript, strikethrough, and blockquotes) with the ability to easily add support for any custom blocks/styles/entities you care to define.

We are not there yet.
