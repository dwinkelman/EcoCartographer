<?php $titleText="Contact"; require_once "header.php"?>

	<div id="contents">
		<div class="section">
		  <h1>Feedback</h1>
		  <p> Questions? Comments? Concerns? Please feel free to contact us through here or leave a comment. We appreciate your feedback.&nbsp;.&nbsp;</p>
		  <form action="index.html" method="post" class="message">
				<input type="text" value="Name" onFocus="this.select();" onMouseOut="javascript:return false;"/>
				<input type="text" value="Email" onFocus="this.select();" onMouseOut="javascript:return false;"/>
				<input type="text" value="Subject" onFocus="this.select();" onMouseOut="javascript:return false;"/>
				<textarea></textarea>
				<input type="submit" value="Send"/>
			</form>
		</div>
		<div class="section contact">
		  <p> For Questions Please Call: <span>336-403-7607</span> </p>
		</div>
	</div>

<?php require_once "footer.php"?>