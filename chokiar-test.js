import chokidar from "chokidar";

chokidar
  .watch("/Users/pmcelhaney/code/counterfact/**/*")
  .on("all", (event, path) => {
    console.log(event, path);
  });
