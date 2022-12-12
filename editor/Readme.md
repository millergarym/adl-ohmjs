


```
aws s3 mb s3://adl-ohm
```

```
yarn build
export AWS_PROFILE=helix
rm dist/node_modules_monaco-editor_esm_vs_basic-languages_*
rm dist/vendors-node_modules_monaco-editor_esm_vs_*
aws s3 cp --recursive --acl public-read dist s3://adl-ohm
open https://adl-ohm.s3.ap-southeast-2.amazonaws.com/index.html
```