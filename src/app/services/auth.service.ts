import { Injectable } from '@angular/core';
import{AngularFireAuth} from '@angular/fire/auth';
import{AngularFirestore} from '@angular/fire/firestore';
import firebase from 'firebase';
import "firebase/firestore"
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize } from 'rxjs/operators';
// import * as CryptoJS from 'crypto-js';


export interface User {
  uid:string;
  email:string;
}

export interface Message{
  createAt: firebase.firestore.FieldValue;
  id: string;
  from: string;
  msg: string;
  fromName:string;
  myMsg:boolean;
  img:File;

}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  currentUser:User = null;
  msgDesEncryp:string;

  constructor(private AFauth: AngularFireAuth, private afs:AngularFirestore, public storage: AngularFireStorage) {
    this.AFauth.onAuthStateChanged(user=>{
      console.log("Change",user);
      this.currentUser=user;
    })
  }

  login(email:string,password:string){
    return new Promise((resolve,rejected)=>{
      this.AFauth.signInWithEmailAndPassword(email,password).then(user =>{
        resolve(user)
      }).catch(err=>rejected(err));
    });  
  }

  async singUp(email:string,password:string){
    const credential = await this.AFauth.createUserWithEmailAndPassword(email,password);

    console.log("Credential:"+credential)

    const uid = credential.user.uid;
    
    return this.afs.doc(
      `users/${uid}`
    ).set({
      uid,
      email: credential.user.email
    });
  }

  addChatMessage(msg,img){
    return this.afs.collection("messages").add({
      msg,
      img,
      from:this.currentUser.uid,
      createAt: firebase.firestore.FieldValue.serverTimestamp()
    })

  }

  getChatMessages(){
    let users = [];

    return this.getUsers().pipe(
      switchMap(res => {
        users = res;
        console.log("Usuarios",users);
        return this.afs.collection("messages",ref => ref.orderBy("createAt")).valueChanges({idField:'id'}) as Observable<Message[]>;
      }),
      map(messages => {
        for(let m of messages){
          this.msgDesEncryp = CryptoJS.AES.decrypt(m.msg, "AndresExamen").toString(CryptoJS.enc.Utf8);
          m.msg = this.msgDesEncryp;
          m.fromName = this.getUserForMsg(m.from,users);
          m.myMsg = this.currentUser.uid == m.from;
        }
        console.log("Mensajes",messages)
        return messages;
      })
    )
  }

  getUsers(){
      return this.afs.collection('users').valueChanges({idField:'uid'}) as Observable<User[]>;
  }

  getUserForMsg(msgFromId, users:User[]):string{
    for(let usr of users){
      console.log("user.uid",usr.uid);
      console.log("msgFromId",msgFromId);
      if(usr.uid == msgFromId){
        console.log("email",usr.email);
        return usr.email;
      }
    }

    return "Anonimo";
  }

  uploadImage(f: any, path: string, name: string): Promise<string>{
    return new Promise( resolve => {
      const fPath = path + '/' + name;
      const ref =  this.storage.ref(fPath);
      const Task =  ref.put(f);
      Task.snapshotChanges().pipe(
        finalize( () => {
          ref.getDownloadURL().subscribe(res => {
            const downUrl = res;
            resolve(downUrl);
            return;
          });
        })
      ).subscribe();
    });
  }

  logout(){
    return this.AFauth.signOut();
  }

}
