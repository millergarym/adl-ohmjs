


```
aws s3 mb s3://adl-ohm
```

```
yarn build
export AWS_PROFILE=helix
aws s3 cp --recursive --acl public-read dist s3://adl-ohm
```