# installation

- **clone** from bitbucket to local file system

- execute **npm install**

# api

convert examples\1.svg to examples\1.png

    node svgtopng.js examples\1.svg 
    
convert examples\1.svg to any\folder\othername.png

    node svgtopng.js -o any\folder\othername.png
    
convert http://example.domain.com/examples/1.svg to any\folder\othername.png

    node http://example.domain.com/examples/1.svg -o any\folder\othername.png
    
Notice: Using svg from url -o is required    
    
    
    

additional parameters:

    -w <int width>                - default 400
    -h <int height>               - default 300
    -p <int padding>              - default 0
    -b <any css color format>     - default transparent
    -o <output path>              - defautl path of input file with extension changed from svg to png
    
    
* Important: use path separator propriet for operating system that you use, if windows use \ if *nix use /    
  
  
    
 
 