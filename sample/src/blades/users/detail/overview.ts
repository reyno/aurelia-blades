export default class {

  userId: number;
  
  async activate(params: { userId: number }) {

    this.userId = params.userId;

  }

}
