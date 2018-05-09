export default class {

  blogId: number;
  
  async activate(params: { blogId: number }) {

    this.blogId = params.blogId;

  }

}
