import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

const router: Router = Router();

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
    // Getting a set of items from our database
    const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
    // Taking the key (item.url) from the database and trying to get a signed URL from S3.
    // In that way, the client can access to that resource directly.
    items.rows.map((item) => {
            if(item.url) {
                item.url = AWS.getGetSignedUrl(item.url);
            }
    });
    res.send(items);
});

//@TODO
//Add an endpoint to GET a specific resource by Primary Key
router.get('/:id', async (req: Request, res: Response) => {

    let { id } = req.params;
    if (!id) {return res.status(400).send('id is required');}

    const it = await FeedItem.findByPk(id);
    if (it === null) {
        res.send("id not found: " + id);
    } else {
      console.log(it);
      res.send(it);
    }       

});

// update a specific resource
router.patch('/:id', 
    requireAuth, 
    async (req: Request, res: Response) => {

        let { id } = req.params;
        let { caption } = req.params;
        if (!id || !caption) {return res.status(400).send('All the parameters are required');}
        
        //@TODO try it yourself        
        await FeedItem.update({ caption: caption }, {
            where: {
            id: id
            }
        });

});


// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', 
    requireAuth, 
    async (req: Request, res: Response) => {
    console.log("filename call");    
    let { fileName } = req.params;
    // Requesting a specific signed URL that will only work with the file we're attemping to upload
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded 
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', 
    requireAuth, 
    async (req: Request, res: Response) => {
    const caption = req.body.caption;
    const fileName = req.body.url;

    // check Caption is valid
    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed' });
    }

    // check Filename is valid
    if (!fileName) {
        return res.status(400).send({ message: 'File url is required' });
    }

    const item = await new FeedItem({
            caption: caption,
            url: fileName
    });

    const saved_item = await item.save();

    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
    res.status(201).send(saved_item);
});

export const FeedRouter: Router = router;