var express = require('express');
var router = express.Router();
var RegionModel = require('../models/regionModel');
var VRItem = require('../models/vrModel')
const upload = require("../models/upload");

router.get('/', function (req, res) {
    RegionModel.aggregate([{
            $lookup: {
                from: "vritems", // collection to join
                localField: "_id",//field from the input documents
                foreignField: "region_id",//field from the documents of the "from" collection
                as: "vrList"// output array field
            }
        }], function (err, data) {
        if (err) return res.status(500).send({ error: 'database failure' });
        console.log(data)
        res.render('region-list-view', { regionList: data});
        
    });
});

router.get('/new', function (req, res) {
    res.render('region-add',);
});

router.post('/new', function (req, res) {
    var region = new RegionModel();
    var body = req.body;
    region.name = body.regionName;
    region.location = body.regionLocation;
    region.save(function (err) {
        if (err) {
            console.error(err);
            res.send(err);
            return;
        }
    });
    res.redirect('/admin/regions');
});

router.post('/add_item', async (req, res) => {
    try 
    {
        await upload(req, res);
        if (req.file == undefined) {
            return res.send(`You must select a file.`);
        }

        var vritem = new VRItem();
        var body = req.body;

        if (!req.file)
            return res.status(400).send('No files were uploaded.');

        vritem.region_id = new mongoose.Types.ObjectId(body.vrid);
        vritem.scene_name = body.SceneName;
        vritem.image_file = req.file.id;
        vritem.link_l = body.leftPos;
        vritem.link_u = body.upPos;
        vritem.link_r = body.rightPos;
        vritem.link_d = body.downPos;

        vritem.save(function (err) {
            if (err) {
                console.error(err);
                res.send(err);
                return;
            }
        });
        res.redirect('/admin/regions');
  } catch (error) {
    console.log(error);
    return res.send(`Error when trying upload image: ${error}`);
  }
});

var mongoose = require('mongoose');
// init gfs
const mongoURI = "mongodb://localhost:27017/vr_images";

// connection
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let gfs;
conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "images"
  });
});

router.delete('/delete/:id', function (req, res) {
    
    VRItem.find({'region_id': req.params.id}, function (err, vritem) {
        if (err) return res.status(500).json({ error: err });
        if (vritem)
        {
            const obj_id = new mongoose.Types.ObjectId(vritem[0].image_file);
            gfs.delete(obj_id);
        }
    });

    RegionModel.deleteOne({ _id:req.params.id }, function (err, output) {
        if(err) return res.status(500).json({ error: "database failure" });

        /* ( SINCE DELETE OPERATION IS IDEMPOTENT, NO NEED TO SPECIFY )
        if(!output.result.n) return res.status(404).json({ error: "book not found" });
        res.json({ message: "book deleted" });
        */

        //console.log('check');

        //res.end();
    })

    VRItem.deleteMany({ region_id:req.params.id }, function (err, output) {
        if(err) return res.status(500).json({ error: "database failure" });

        /* ( SINCE DELETE OPERATION IS IDEMPOTENT, NO NEED TO SPECIFY )
        if(!output.result.n) return res.status(404).json({ error: "book not found" });
        res.json({ message: "book deleted" });
        */

        //console.log(output);

        //res.end();
    });
    
    res.redirect(303,'/admin/regions/');
});

router.get('/add_vr/:id', function (req, res) {
    console.log(req.params.id);
    res.render('vr-add', {region_id:req.params.id});
});

router.get('/:id', function (req, res) {

});

module.exports = router;
