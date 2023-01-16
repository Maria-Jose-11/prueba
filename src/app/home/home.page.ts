import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService, Message } from '../services/auth.service';
import * as CryptoJS from 'crypto-js';
import { AngularFireStorage } from '@angular/fire/storage';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage{

  @ViewChild(IonContent) content: IonContent;

  messages: Observable<Message[]>;
  newMsg= '';
  msgEncryption:'';
  passwordAES = 'AndresExamen';
  newFile='';
  uploadProgress= 0;
  img = '';
  user='';
  preimagen=false;


  constructor(private autservice:AuthService,
    private router:Router,
    public loadingCtrl: LoadingController,
    private afStorage: AngularFireStorage) {}
  
  ngOnInit(){
    this.messages = this.autservice.getChatMessages();
    this.user = this.autservice.currentUser.email;
  }

  async sendMessage(){
    const loading = await this.loadingCtrl.create();

    this.msgEncryption = CryptoJS.AES.encrypt(this.newMsg.trim(),this.passwordAES.trim()).toString();
    /*if (this.newFile !== undefined){
      await loading.present();
      const res = await this.autservice.uploadImage(this.newFile, "/Messages", this.autservice.currentUser.uid);
      this.img = res;
      this.preimagen=false;
    }*/
    this.autservice.addChatMessage(this.msgEncryption,this.img).then(()=>{
      this.newMsg = '';
      this.msgEncryption='';
      this.img = '';
      this.newFile='';
      this.content.scrollToBottom();
      loading.dismiss();
    })
  }

  newMesgImg(event: any){
    console.log("evento",event)
    if (event.target.files && event.target.files[0]){
      this.newFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = ((image) => {
        this.img = image.target.result as string;
      });
      reader.readAsDataURL(event.target.files[0]);

    }
  }

  upload(){
    
    let file = (<HTMLInputElement>document.getElementById('file')).files[0];
    let ref = this.afStorage.ref('upload'+this.autservice.currentUser.uid+'/'+file.name);
    this.preimagen = true;
    ref.put(file).then(res=>{
      ref.getDownloadURL().subscribe(url=>{
        this.preimagen = false
        this.img = url
      });
    }).catch(err=>{
      console.log(err)
      this.preimagen = false;
    });
  }

  /*async uploadFile(f: FileEntry){
    const path = f.nativeURL.substr(0,f.nativeURL.lastIndexOf('/')+1)
    const buffer = await this.file.readAsArrayBuffer(path,f.name);
    const type = this.getMimeType(f.name.split('.').pop());
    const fileBlod = new Blob([buffer],type)

    const randomId = this.autservice.currentUser.uid;

    const uploadTask = this.storage.upload(`files/${new Date().getTime()}_${randomId}`, fileBlod);

    uploadTask.percentageChanges().subscribe(changes=>{
      0 - 100
      this.uploadProgress = changes
    })

    uploadTask.then(async res => {
      const toast = await this.toastCtrl.create({
        duration: 3000,
        message: 'File send success'
      });
      toast.present();
    });
  }*/

  logout(){
    this.autservice.logout().then(()=>{
      this.router.navigateByUrl('/',{replaceUrl:true});
    })
  }
}
