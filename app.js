//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

require("dotenv").config();
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const workItems = [];


mongoose.connect(process.env.CONNECTION_URL, {useNewUrlParser : true,  useUnifiedTopology: true});

const itemSchema = new mongoose.Schema({
  name : String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name : "Welecome to your Todo List!"
});

const item2 = new Item({
  name : "Save new item by clicking on +"
});

const item3 = new Item({
  name : "<-- Click on this to delete."
});

const listSchema = new mongoose.Schema({
  name : String,
  items : [itemSchema]
});

const List = mongoose.model("List", listSchema);

const itemList = [item1, item2, item3];

app.get("/", function(req, res) {


  Item.find(function(err, findItems){//returns findItems (array)
    if(err){
      console.log(err);
    } else {
      //console.log(findItems);

      if(findItems.length === 0){
        Item.insertMany(itemList, function(err){
          if(err){
            console.log(err);
          } else {
            console.log("Successfully added the documents");
            res.redirect('/');
          }
        });
      } else {
        res.render("list", {listTitle: "Today", newListItems: findItems});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listTitle = _.capitalize(req.body.list);
  console.log(itemName + " " + listTitle);
  const addItem = new Item({
    name : itemName
  });

  if(listTitle === "Today"){
    addItem.save();//getting saved in our database
    res.redirect('/');
  } else {
    List.findOne({name:listTitle}, function(err, findItem){
      if(!err){
        //console.log(findItem);
        findItem.items.push(addItem);
        findItem.save(function(err){
          res.redirect("/" + listTitle);
        })
      } else {
        console.log(err);
      }
    });
  }

});

app.post('/delete', function(req, res){
  const deleteItem = (req.body.checkBox);//returns _id that is its value checkBox is the name
  const listName = _.capitalize(req.body.listName);

  if(listName === "Today"){
    Item.findByIdAndRemove(deleteItem, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Successfully removed");
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({name:listName}, {$pull : {items: {_id: deleteItem}}}, function(err, result){
      if(err){
        console.log(err);
      } else {
        res.redirect("/" + listName);
      }
    });
  }

});

// To create list on the fly (creating list dynamically)
app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);
  List.findOne({name : customListName}, function(err, findList){//returns findList (object)
    if(err){
      console.log(err);
    } else{
      if(!findList){
        const list = new List({
          name : customListName,
          items : itemList
        });

        list.save();
        res.redirect("/" + customListName);

      } else {
        res.render("list", {listTitle:findList.name, newListItems : findList.items});
      }
    }
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
