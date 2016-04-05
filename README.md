# OZ recording creator (cli)

## Installation

1. `git clone https://github.com/ozinc/recording-creator-cli.git`
2. `cd recording-creator-cli` and `npm install`
3. Run!

## Example usage

```bash
node index.js --token <token> \
  --channel=mychannelslug \ 
  --title="The Simpsons" \
  --in="2016-04-05 19:25:00" \
  --out="2016-04-05 19:45:00"
```
If successful, the script will output a link to the newly created video on https://creator.oz.com so one can edit the metadata for the video.
