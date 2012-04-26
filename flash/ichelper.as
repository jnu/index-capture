package  {
	import flash.external.ExternalInterface;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.system.Security;
	import flash.display.SimpleButton;
	import flash.display.Shape;
	import flash.display.MovieClip;
	import nochump.util.zip.*;
	
	public class ICHelper extends MovieClip
	{
		private var zip:ZipOutput;
		private var prefix:String;
		private var init:Boolean = false;
		private var usedNames:Array = new Array();
		public var myButton:SimpleButton;
		
		public function ICHelper()
		{
			Security.allowDomain("*");
			addCallbacks();
		}
		
		public function create(myPrefix:String="zip"):void
		{
			zip = new ZipOutput();
			prefix = myPrefix;
			init = true;
		}
		
		public function addFile(myName:String="", myData:String=""):void
		{
			if( !init )
			{
				toJS(false);
				return;
			}
			myName = prefix + '-' + myName;
			var n:Number = 0;
			while( usedNames.indexOf(myName)+1 )
			{
				// Iterate until a unique name is found: increment
				// n and affix to find a unique name.
				if(n++) myName = myName.substr(0, myName.lastIndexOf('-'));
				myName += '-' + n;
			}
			usedNames.push(myName);
			ExternalInterface.call('console.log', "Adding "+myName);
			var data:ByteArray = new ByteArray();
			data.writeUTF(myData);
			var ze:ZipEntry = new ZipEntry(myName);
			zip.putNextEntry(ze);
			zip.write(data);
			zip.closeEntry();
			toJS(true);
		}
		
		public function finish():void
		{
			if(!init)
			{
				toJS(false);
				return;
			}
			zip.finish();
			// Show button: User interaction must call download.
			setupButton();
			addChild(myButton);
			myButton.addEventListener(MouseEvent.CLICK, onMouseClickEvent);
			ExternalInterface.call('console.log', "Made button.");
		}
		
		protected function onMouseClickEvent(e:Event):void
		{
				var bytes:ByteArray = zip.byteArray;
				ExternalInterface.call('console.log', "Got bytes.");
				var file:FileReference = new FileReference();
				file.save(bytes, prefix+".zip");
				toJS(true);
		}
		
		public function addCallbacks():void
		{
			if( ExternalInterface.available )
			{
				ExternalInterface.addCallback('createZip', create);
				ExternalInterface.addCallback('addFileToZip', addFile);
				ExternalInterface.addCallback('generateZip', finish);
				ExternalInterface.call('console.log', "Flash Zip Helper: Adding callbacks");
			}
		}
		
		public function toJS(status:Object):Object
		{
			if( ExternalInterface.available )
			{
				ExternalInterface.call("fromAS", status);
				return status;
			}
			return null;
		}
		
		private function setupButton():void
		{
			myButton = new SimpleButton();
			myButton.x = 70;
			myButton.y = 15;
			var width = 140;
			var height = 30;
			myButton.upState = makeSquare(0xFF9933, width, height);
			myButton.overState = makeSquare(0xFF6600, width, height);
			myButton.downState = makeSquare(0xCC6600, width, height);
			myButton.hitTestState = myButton.upState;
		}
		
		private function makeSquare(color:uint, width:Number, height:Number):Shape
		{
			var square:Shape = new Shape();
			square.graphics.beginFill(color, 1);
			square.graphics.drawRect(0, 0, width, height);
			square.graphics.endFill();
			return square;
		}
	}
}