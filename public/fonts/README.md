# Self-hosted Google fonts

These files were retrieved unchanged from the official Google Fonts CSS API and
`fonts.gstatic.com` on 2026-08-25 and 2026-08-26. They are stored locally so the site does not
depend on Google Fonts being reachable at runtime.

## Material Symbols Rounded

Local file: `material-symbols-rounded-subset.woff2`

The CSS API request uses `icon_names`, so this is an icon-name subset rather
than the complete Material Symbols family. The icon names are alphabetically
sorted as required by the API:

```text
arrow_back,arrow_outward,article,badge,business_center,close,code,construction,dark_mode,home,hourglass_empty,language,light_mode,mail,menu,more_horiz,palette,person,precision_manufacturing,science,smart_display,sports_esports,work
```

Requested variable ranges:

- optical size (`opsz`): 20–48
- weight (`wght`): 100–700
- fill (`FILL`): 0–1
- grade (`GRAD`): -50–200

Official CSS API request:

```text
https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=arrow_back,arrow_outward,article,badge,business_center,close,code,construction,dark_mode,home,hourglass_empty,language,light_mode,mail,menu,more_horiz,palette,person,precision_manufacturing,science,smart_display,sports_esports,work&display=block
```

Official `woff2` URL returned by that request:

```text
https://fonts.gstatic.com/l/font?kit=sykg-zNym6YjUruM-QrEh7-nyTnjDwKNJ_190FjzarEYXoBFX9-kani4PLuw4tYRCUSsjIh-gB-4nT8D3JH8_iEVk1AtvN73iM_I08oaLQek-za7aIB2CGyIlUTrqWBs&skey=70ddea8fe54d532e&v=v368
```

Minimal local declaration:

```css
@font-face {
  font-family: "Material Symbols Rounded";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url("/fonts/material-symbols-rounded-subset.woff2") format("woff2");
}
```

If another icon name is introduced, regenerate this subset instead of assuming
the new ligature is already present. The official usage guide is
<https://developers.google.com/fonts/docs/material_symbols>. Material Symbols
are distributed under the Apache License 2.0; see the official
[Material Design Icons license](https://github.com/google/material-design-icons/blob/master/LICENSE).

## Space Mono

Local file: `space-mono-latin-400-italic.woff2`

This is the Latin subset of Space Mono Regular Italic (`font-weight: 400`),
used by the home-page ASCII portrait.

Official CSS API request:

```text
https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@1,400&display=swap
```

Official `woff2` URL returned for the Latin subset:

```text
https://fonts.gstatic.com/s/spacemono/v17/i7dNIFZifjKcF5UAWdDRYERMR3K_.woff2
```

Space Mono is distributed under the SIL Open Font License 1.1; see its
[official Google Fonts source](https://github.com/google/fonts/tree/main/ofl/spacemono).

## Roboto Flex

Local files:

- `roboto-flex-latin.woff2`
- `roboto-flex-latin-ext.woff2`

Both files provide normal-style Roboto Flex with optical size (`opsz`) 8–144
and weight (`wght`) 100–1000. Only the `latin` and `latin-ext` files returned
by the API were retained; Cyrillic, Greek, and Vietnamese subsets were omitted.

Official CSS API request:

```text
https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap
```

Official `woff2` URLs selected from that response:

```text
latin:
https://fonts.gstatic.com/s/robotoflex/v30/NaNNepOXO_NexZs0b5QrzlOHb8wCikXpYqmZsWI-__OGbt8jZktqc2V3Zs0KvDLdBP8SBZtOs2IifRuUZQMsPJtUsR4DEK6cULNeUx9XgTnH37Ha_FIAp4Fm0PP1hw45DntW2x0wZGzhPmr1YNMYKYn9_1IQXGwJAiUJVUMdN5YUW4O8HtSoXjC79QRyaLshNDUf3e0O-gn5rrZCu20YNau4OPE.woff2

latin-ext:
https://fonts.gstatic.com/s/robotoflex/v30/NaNNepOXO_NexZs0b5QrzlOHb8wCikXpYqmZsWI-__OGbt8jZktqc2V3Zs0KvDLdBP8SBZtOs2IifRuUZQMsPJtUsR4DEK6cULNeUx9XgTnH37Ha_FIAp4Fm0PP1hw45DntW2x0wZGzhPmr1YNMYKYn9_1IQXGwJAiUJVUMdN5YUW4O8HtSoXjC79QRyaLshNDUf3e0O-gn5rrZCu20YNau2OPF80A.woff2
```

The exact `unicode-range` declarations returned by Google Fonts are:

```css
/* latin-ext */
@font-face {
  font-family: "Roboto Flex";
  font-style: normal;
  font-weight: 100 1000;
  font-stretch: 100%;
  font-display: swap;
  src: url("/fonts/roboto-flex-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7,
    U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F,
    U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113,
    U+2C60-2C7F, U+A720-A7FF;
}

/* latin */
@font-face {
  font-family: "Roboto Flex";
  font-style: normal;
  font-weight: 100 1000;
  font-stretch: 100%;
  font-display: swap;
  src: url("/fonts/roboto-flex-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC,
    U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

Roboto Flex is distributed under the SIL Open Font License 1.1; see its
[official Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/robotoflex/METADATA.pb)
and [license](https://github.com/google/fonts/blob/main/ofl/robotoflex/OFL.txt).

## Integrity

All four files have the `wOF2` signature.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `material-symbols-rounded-subset.woff2` | 34,640 | `ea73dc02258166f3d6fdef9711e468acce2f1aaf4b127e342cd23054dacabc45` |
| `space-mono-latin-400-italic.woff2` | 18,300 | `a5fb49042e7305918585561ab5fbd587d708ce74b0f54b56751e2b1151922d19` |
| `roboto-flex-latin.woff2` | 84,304 | `e97ca92cebcf4df3539f6514cd652a84a827939e6d5eaf5edece6d83c8229138` |
| `roboto-flex-latin-ext.woff2` | 59,020 | `014d773ca7925baa663a7d7f8b2475a81623d6ae7d35e66fdf100f261abd79ed` |
