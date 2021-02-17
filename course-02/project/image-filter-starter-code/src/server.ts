import express, { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  app.get('/filteredimage:image_URL', async (req: Request, res: Response) => {

        let {url} = req.query;                
        
        // check to make sure the url is set
        if (!url) {           
          return res.status(400).send('url is required');
        }

        const filteredpath: string = await filterImageFromURL(url);        
        res.status(200).sendFile(filteredpath,() => deleteLocalFiles([filteredpath]));
     
  });
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();